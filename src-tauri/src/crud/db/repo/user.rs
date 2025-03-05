use crate::crud::db::model::LibreUser;
use crate::crud::db::schema::libre_user::dsl::libre_user;
use diesel::{QueryResult, RunQueryDsl, SelectableHelper, SqliteConnection};

pub fn get_user(conn: &mut SqliteConnection) -> QueryResult<LibreUser> {
    libre_user.first(conn)
}

pub fn update_user(
    conn: &mut SqliteConnection,
    user_name: &str,
    user_avatar: &str,
) -> QueryResult<LibreUser> {
    libre_user.first(conn).map(|mut user: LibreUser| {
        user.name = Some(user_name.to_owned());
        user.avatar = Some(user_avatar.to_owned());

        diesel::update(libre_user)
            .set(&user)
            .returning(LibreUser::as_returning())
            .get_result(conn)
    })?
}
