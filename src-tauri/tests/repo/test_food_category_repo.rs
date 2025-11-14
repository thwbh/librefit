use crate::helpers::setup_test_pool;
use librefit_lib::crud::db::repo::food_category;

#[test]
fn test_get_food_categories() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = food_category::get_food_categories(&mut conn);

    assert!(result.is_ok());
    let categories = result.unwrap();

    // Should have the pre-seeded categories from migration
    assert_eq!(categories.len(), 6); // b, l, d, s, t, u

    // Verify categories exist
    let short_values: Vec<String> = categories.iter().map(|c| c.shortvalue.clone()).collect();
    assert!(short_values.contains(&"b".to_string()));
    assert!(short_values.contains(&"l".to_string()));
    assert!(short_values.contains(&"d".to_string()));
    assert!(short_values.contains(&"s".to_string()));
    assert!(short_values.contains(&"t".to_string()));
    assert!(short_values.contains(&"u".to_string()));
}

#[test]
fn test_get_food_category_breakfast() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = food_category::get_food_category(&mut conn, "b".to_string());

    assert!(result.is_ok());
    let category = result.unwrap();
    assert_eq!(category.shortvalue, "b");
    assert_eq!(category.longvalue, "Breakfast");
}

#[test]
fn test_get_food_category_lunch() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = food_category::get_food_category(&mut conn, "l".to_string());

    assert!(result.is_ok());
    let category = result.unwrap();
    assert_eq!(category.shortvalue, "l");
    assert_eq!(category.longvalue, "Lunch");
}

#[test]
fn test_get_food_category_dinner() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = food_category::get_food_category(&mut conn, "d".to_string());

    assert!(result.is_ok());
    let category = result.unwrap();
    assert_eq!(category.shortvalue, "d");
    assert_eq!(category.longvalue, "Dinner");
}

#[test]
fn test_get_food_category_snack() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = food_category::get_food_category(&mut conn, "s".to_string());

    assert!(result.is_ok());
    let category = result.unwrap();
    assert_eq!(category.shortvalue, "s");
    assert_eq!(category.longvalue, "Snack");
}

#[test]
fn test_get_food_category_treat() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = food_category::get_food_category(&mut conn, "t".to_string());

    assert!(result.is_ok());
    let category = result.unwrap();
    assert_eq!(category.shortvalue, "t");
    assert_eq!(category.longvalue, "Treat");
}

#[test]
fn test_get_food_category_unset() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = food_category::get_food_category(&mut conn, "u".to_string());

    assert!(result.is_ok());
    let category = result.unwrap();
    assert_eq!(category.shortvalue, "u");
    assert_eq!(category.longvalue, "Unset");
}

#[test]
fn test_get_food_category_not_found() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = food_category::get_food_category(&mut conn, "z".to_string());

    assert!(result.is_err()); // Should fail for non-existent category
}

#[test]
fn test_get_all_categories_have_values() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let categories = food_category::get_food_categories(&mut conn).unwrap();

    // Verify all categories have non-empty values
    for category in categories {
        assert!(!category.shortvalue.is_empty());
        assert!(!category.longvalue.is_empty());
        assert_eq!(category.shortvalue.len(), 1); // All short values are single char
    }
}
