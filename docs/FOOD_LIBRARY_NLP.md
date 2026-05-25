# Natural Language Food Search with Embeddings

## Overview

This document describes how to implement an offline natural language food search for LibreFit using sentence embeddings. This allows users to type queries like "two portions of pad thai" and get accurate calorie data back.

## How It Works

### Architecture

```
User types: "two portions of pad thai"
         ↓
Parse quantity: "two" → 2.0x multiplier
         ↓
Extract food: "pad thai"
         ↓
Generate embedding: [0.45, 0.12, -0.33, ...] (384 numbers)
         ↓
Search database: Compare with all food embeddings
         ↓
Find best match: "Pad Thai, restaurant style" (450 cal)
         ↓
Apply multiplier: 450 × 2.0 = 900 calories
         ↓
Return to user
```

### What Are Embeddings?

Embeddings are numerical representations of text that capture semantic meaning:

```
"banana" → [0.23, -0.15, 0.87, ..., 0.42]  (384 numbers)
"apple"  → [0.21, -0.12, 0.89, ..., 0.45]  (384 numbers)
"car"    → [-0.67, 0.82, -0.23, ..., 0.11] (384 numbers)
```

Similar concepts have similar vectors. The model finds foods by comparing vector similarity.

## Key Benefits

- ✅ **Fully Offline** - No internet required after setup
- ✅ **No Training Needed** - Use pre-trained model as-is
- ✅ **Fast** - ~10-50ms per query on mobile
- ✅ **Handles Typos** - "pad tai" still finds "pad thai"
- ✅ **Understands Synonyms** - "soda" finds "cola", "soft drink"
- ✅ **Natural Input** - "large bowl of rice" just works
- ✅ **Privacy First** - All processing on-device

## Components

### 1. Embedding Model

**Model:** `all-MiniLM-L6-v2`

- Type: Sentence Transformer (BERT-based encoder)
- Size: ~23MB (ONNX) or ~90MB (PyTorch)
- Dimensions: 384
- Performance: Pre-trained, no fine-tuning needed
- Source: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2

### 2. Food Database

**Source:** Open Food Facts API

- ~5,000-10,000 curated foods
- Pre-computed embeddings stored in SQLite
- Database size: ~12-20 MB
- Fields: name, brand, barcode, calories, protein, carbs, fat

### 3. Search Algorithm

**Cosine Similarity:**

```rust
fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    let dot: f32 = a.iter().zip(b).map(|(x, y)| x * y).sum();
    let mag_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let mag_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    dot / (mag_a * mag_b)
}
```

### 4. Quantity Extraction

**Rule-based parsing:**

```rust
fn parse_quantity(text: &str) -> (&str, f32) {
    let text_lower = text.to_lowercase();

    // Numbers
    if text_lower.contains("two") || text_lower.contains("2") {
        return (text, 2.0);
    }

    // Size descriptors
    if text_lower.contains("large") {
        return (text, 1.5);
    }
    if text_lower.contains("small") {
        return (text, 0.75);
    }

    // Default
    (text, 1.0)
}
```

## Setup Guide

### Prerequisites

```bash
# Install Python dependencies
pip install sentence-transformers pandas requests tqdm
```

### Step 1: Generate Food Database

Run the provided script to create the food database with embeddings:

```bash
cd /Users/steff-man/Projects/librefit
python scripts/generate_food_embeddings.py
```

**Time on M4 MacBook Pro:** ~4-5 minutes

**Output:**

- File: `src-tauri/assets/food_library.db`
- Size: ~12-20 MB
- Contains: 5,000 foods with pre-computed embeddings

### Step 2: Bundle Database with App

Update `src-tauri/tauri.conf.json`:

```json
{
	"bundle": {
		"resources": ["assets/food_library.db"]
	}
}
```

### Step 3: Add Rust Dependencies

Update `src-tauri/Cargo.toml`:

```toml
[dependencies]
# ONNX Runtime for embedding model
ort = "2.0"

# Vector operations
ndarray = "0.16"

# Existing dependencies...
diesel = { version = "2.2", features = ["sqlite", "returning_clauses_for_sqlite_3_35"] }
```

### Step 4: Implement Search in Rust

Create `src-tauri/src/service/food_search.rs`:

```rust
use ndarray::{Array1, ArrayView1};
use ort::{Session, Value};
use diesel::prelude::*;

pub struct FoodSearcher {
    model: Session,
    db: SqliteConnection,
}

impl FoodSearcher {
    pub fn new(model_path: &str, db_path: &str) -> Result<Self> {
        let model = Session::builder()?
            .with_model_from_file(model_path)?;

        let db = SqliteConnection::establish(db_path)?;

        Ok(Self { model, db })
    }

    pub fn search(&self, query: &str) -> Result<Vec<FoodMatch>> {
        // 1. Parse quantity
        let (food_text, multiplier) = parse_quantity(query);

        // 2. Generate embedding
        let query_embedding = self.encode(food_text)?;

        // 3. Search database
        let results = self.find_similar_foods(&query_embedding)?;

        // 4. Apply multiplier
        let mut matches: Vec<_> = results.into_iter()
            .map(|mut m| {
                m.calories = (m.calories as f32 * multiplier) as i32;
                m
            })
            .collect();

        // 5. Sort by similarity
        matches.sort_by(|a, b| {
            b.similarity_score
                .partial_cmp(&a.similarity_score)
                .unwrap()
        });

        Ok(matches.into_iter().take(5).collect())
    }

    fn encode(&self, text: &str) -> Result<Array1<f32>> {
        // Tokenize and run through ONNX model
        // Returns 384-dimensional embedding
        todo!("Implement tokenization and model inference")
    }

    fn find_similar_foods(&self, query_emb: &Array1<f32>)
        -> Result<Vec<FoodMatch>>
    {
        use crate::db::schema::food_item::dsl::*;
        use crate::db::schema::food_embedding::dsl::*;

        let results = food_item
            .inner_join(food_embedding)
            .load::<(FoodItem, FoodEmbedding)>(&self.db)?;

        let matches: Vec<_> = results.into_iter()
            .map(|(food, embedding)| {
                let emb_array = deserialize_embedding(&embedding.embedding);
                let similarity = cosine_similarity(
                    query_emb.view(),
                    emb_array.view()
                );

                FoodMatch {
                    id: food.id,
                    name: food.name,
                    brand: food.brand,
                    calories: food.calories_per_100g,
                    protein: food.protein_per_100g,
                    carbs: food.carbs_per_100g,
                    fat: food.fat_per_100g,
                    similarity_score: similarity,
                }
            })
            .collect();

        Ok(matches)
    }
}

fn parse_quantity(text: &str) -> (&str, f32) {
    let lower = text.to_lowercase();

    // Extract numeric multipliers
    if lower.contains("two") || lower.contains("2") { return (text, 2.0); }
    if lower.contains("three") || lower.contains("3") { return (text, 3.0); }
    if lower.contains("half") || lower.contains("0.5") { return (text, 0.5); }

    // Size descriptors
    if lower.contains("large") { return (text, 1.5); }
    if lower.contains("small") { return (text, 0.75); }
    if lower.contains("tiny") { return (text, 0.5); }

    (text, 1.0)
}

fn cosine_similarity(a: ArrayView1<f32>, b: ArrayView1<f32>) -> f32 {
    let dot = a.dot(&b);
    let norm_a = a.dot(&a).sqrt();
    let norm_b = b.dot(&b).sqrt();
    dot / (norm_a * norm_b)
}

fn deserialize_embedding(bytes: &[u8]) -> Array1<f32> {
    let float_slice = unsafe {
        std::slice::from_raw_parts(
            bytes.as_ptr() as *const f32,
            bytes.len() / 4
        )
    };
    Array1::from_vec(float_slice.to_vec())
}

#[derive(Debug)]
pub struct FoodMatch {
    pub id: i32,
    pub name: String,
    pub brand: Option<String>,
    pub calories: i32,
    pub protein: Option<f32>,
    pub carbs: Option<f32>,
    pub fat: Option<f32>,
    pub similarity_score: f32,
}
```

### Step 5: Create Tauri Command

Create `src-tauri/src/cmd/search_food.rs`:

```rust
use crate::service::food_search::FoodSearcher;

#[tauri::command]
pub async fn search_food_nlp(
    query: String,
    searcher: tauri::State<'_, FoodSearcher>
) -> Result<Vec<FoodMatch>, String> {
    searcher.search(&query)
        .map_err(|e| e.to_string())
}
```

Register in `src-tauri/src/lib.rs`:

```rust
use cmd::search_food::search_food_nlp;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize food searcher
            let model_path = app.path()
                .resolve("assets/model.onnx", BaseDirectory::Resource)?;
            let db_path = app.path()
                .resolve("assets/food_library.db", BaseDirectory::Resource)?;

            let searcher = FoodSearcher::new(
                model_path.to_str().unwrap(),
                db_path.to_str().unwrap()
            )?;

            app.manage(searcher);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            search_food_nlp,
            // ... other commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Step 6: Create Svelte UI Component

Create `src/lib/component/intake/FoodSearch.svelte`:

```svelte
<script lang="ts">
	import { searchFoodNlp } from '$lib/api/gen/commands';
	import type { FoodMatch } from '$lib/api/gen/types';

	let query = $state('');
	let results = $state<FoodMatch[]>([]);
	let isSearching = $state(false);

	async function handleSearch() {
		if (!query.trim()) {
			results = [];
			return;
		}

		isSearching = true;
		try {
			results = await searchFoodNlp({ query });
		} catch (err) {
			console.error('Search failed:', err);
			results = [];
		} finally {
			isSearching = false;
		}
	}

	function selectFood(food: FoodMatch) {
		// Add to intake
		console.log('Selected:', food);
	}
</script>

<div class="food-search">
	<input
		type="text"
		class="input input-bordered w-full"
		placeholder="Type a food... (e.g., 'two bananas', 'large bowl of rice')"
		bind:value={query}
		oninput={handleSearch}
	/>

	{#if isSearching}
		<div class="loading loading-spinner loading-sm"></div>
	{/if}

	{#if results.length > 0}
		<div class="results-list mt-2">
			{#each results as food}
				<button class="result-item" onclick={() => selectFood(food)}>
					<div class="food-name">
						{food.name}
						{#if food.brand}
							<span class="brand">({food.brand})</span>
						{/if}
					</div>
					<div class="food-nutrition">
						{food.calories} cal
						{#if food.protein}
							• {food.protein}g protein
						{/if}
					</div>
					<div class="similarity-score">
						Match: {(food.similarity_score * 100).toFixed(0)}%
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.result-item {
		@apply w-full p-3 text-left border-b hover:bg-base-200 cursor-pointer;
	}

	.food-name {
		@apply font-semibold;
	}

	.brand {
		@apply text-sm opacity-70;
	}

	.food-nutrition {
		@apply text-sm mt-1;
	}

	.similarity-score {
		@apply text-xs opacity-50 mt-1;
	}
</style>
```

## Database Schema

Add to Diesel migrations:

```sql
-- up.sql
CREATE TABLE food_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand TEXT,
    barcode TEXT,
    calories_per_100g INTEGER NOT NULL,
    protein_per_100g REAL,
    carbs_per_100g REAL,
    fat_per_100g REAL,
    fiber_per_100g REAL,
    source TEXT DEFAULT 'openfoodfacts',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE food_embedding (
    food_id INTEGER PRIMARY KEY,
    embedding BLOB NOT NULL,
    FOREIGN KEY (food_id) REFERENCES food_item(id)
);

CREATE INDEX idx_food_name ON food_item(name);
CREATE INDEX idx_food_barcode ON food_item(barcode);
```

## Example Queries

The system can handle natural language queries:

```
"banana" → Finds: Banana, fresh (89 cal/100g)

"two bananas" → Finds: Banana × 2 = 178 cal

"pad thai from restaurant" → Finds: Pad Thai, restaurant style (450 cal)

"large bowl of rice" → Finds: White rice, cooked × 1.5 = 300 cal

"grilled chicken breast" → Finds: Chicken breast, grilled (165 cal/100g)

"half an avocado" → Finds: Avocado × 0.5 = 120 cal

"small apple" → Finds: Apple, fresh × 0.75 = 65 cal
```

## Performance

### Generation Time (One-time, M4 MacBook Pro)

| Step                     | Time             |
| ------------------------ | ---------------- |
| Download model           | ~30 seconds      |
| Download 15,000 products | ~2-3 minutes     |
| Filter to 5,000 foods    | ~10 seconds      |
| Generate embeddings      | ~30-60 seconds   |
| Write to SQLite          | ~5 seconds       |
| **Total**                | **~4-5 minutes** |

### Runtime Performance (Android/Mobile)

| Operation                | Time                         |
| ------------------------ | ---------------------------- |
| Load model               | ~100-200ms (once at startup) |
| Generate query embedding | ~10-50ms                     |
| Search 5,000 foods       | ~5-15ms                      |
| **Total per query**      | **~15-65ms**                 |

Fast enough for search-as-you-type!

## Size Impact

| Component                       | Size       |
| ------------------------------- | ---------- |
| Embedding model (ONNX)          | ~23 MB     |
| Food database (5,000 items)     | ~12 MB     |
| Embeddings (5,000 × 384 floats) | ~7 MB      |
| **Total increase**              | **~42 MB** |

Reasonable for a major feature upgrade.

## Future Enhancements

### Phase 2 Features

1. **Barcode Scanning**

   - Use device camera
   - Look up by barcode in database
   - Fallback to Open Food Facts API

2. **Recent Foods**

   - Track frequently used foods
   - Show at top of search results
   - Faster for repeat meals

3. **Favorites**

   - Star favorite foods
   - Quick-add from favorites list

4. **Custom Foods**

   - Allow users to add custom items
   - Store in separate table
   - Include in searches

5. **Recipe Combinations**

   - Save multi-food meals
   - "My usual breakfast" = eggs + toast + banana
   - One-tap logging

6. **Multilingual Support**
   - Use `paraphrase-multilingual-MiniLM-L12-v2`
   - Search in any language
   - Automatic translation

## Resources

- **Sentence Transformers:** https://www.sbert.net/
- **Model Card:** https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
- **Open Food Facts:** https://world.openfoodfacts.org/
- **ONNX Runtime:** https://onnxruntime.ai/
- **Candle (Rust ML):** https://github.com/huggingface/candle

## Notes

- **No training required** - Model works out-of-the-box
- **Fully offline** - All processing on-device
- **Privacy-first** - No data leaves the device
- **Fast enough** - Real-time search on mobile
- **Reasonable size** - ~40MB total increase
- **Easy maintenance** - Regenerate database periodically

## Next Steps

1. Run `scripts/generate_food_embeddings.py`
2. Bundle database with app
3. Implement Rust search function
4. Create Svelte UI component
5. Test on Android device
6. Iterate based on user feedback
