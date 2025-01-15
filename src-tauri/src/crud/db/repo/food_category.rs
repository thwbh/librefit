use crate::crud::db::model::FoodCategory;
use crate::crud::db::schema::food_category::dsl::food_category;
use diesel::{QueryResult, RunQueryDsl, SqliteConnection};

pub fn get_food_categories(conn: &mut SqliteConnection) -> QueryResult<Vec<FoodCategory>> {
    food_category.load::<FoodCategory>(conn)
}
