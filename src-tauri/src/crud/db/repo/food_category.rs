use crate::crud::db::model::FoodCategory;
use crate::crud::db::schema::food_category::dsl::food_category;
use diesel::query_dsl::methods::FilterDsl;
use diesel::{ExpressionMethods, QueryResult, RunQueryDsl, SqliteConnection};

pub fn get_food_categories(conn: &mut SqliteConnection) -> QueryResult<Vec<FoodCategory>> {
    food_category.load::<FoodCategory>(conn)
}

pub fn get_food_category(conn: &mut SqliteConnection, key: String) -> QueryResult<FoodCategory> {
    use crate::crud::db::schema::food_category::dsl::shortvalue;

    food_category.filter(shortvalue.eq(key)).first(conn)
}
