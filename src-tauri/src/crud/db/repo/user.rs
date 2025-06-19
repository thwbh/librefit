use crate::crud::db::model::LibreUser;
use crate::crud::db::schema::libre_user::dsl::libre_user;
use diesel::{OptionalExtension, QueryResult, RunQueryDsl, SelectableHelper, SqliteConnection};

pub fn get_user(conn: &mut SqliteConnection) -> QueryResult<Option<LibreUser>> {
    libre_user.first(conn).optional()
}

pub fn update_user(
    conn: &mut SqliteConnection,
    user_name: &str,
    user_avatar: &str,
) -> QueryResult<LibreUser> {
    libre_user
        .first(conn)
        .optional()
        .map(|result: Option<LibreUser>| match result {
            Some(mut user) => {
                user.name = Some(user_name.to_owned());
                user.avatar = Some(user_avatar.to_owned());

                diesel::update(libre_user)
                    .set(&user)
                    .returning(LibreUser::as_returning())
                    .get_result(conn)
            }
            None => diesel::insert_into(libre_user)
                .values(LibreUser {
                    id: 1,
                    name: Some(user_name.to_owned()),
                    avatar: Some(user_avatar.to_owned()),
                })
                .returning(LibreUser::as_returning())
                .get_result(conn),
        })?
}
