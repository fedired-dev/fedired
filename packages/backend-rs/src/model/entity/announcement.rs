//! `SeaORM` Entity, @generated by sea-orm-codegen 1.0.0

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[sea_orm(table_name = "announcement")]
#[macros::export(object, js_name = "Announcement")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    #[sea_orm(column_name = "createdAt")]
    pub created_at: DateTimeWithTimeZone,
    pub text: String,
    pub title: String,
    #[sea_orm(column_name = "imageUrl")]
    pub image_url: Option<String>,
    #[sea_orm(column_name = "updatedAt")]
    pub updated_at: Option<DateTimeWithTimeZone>,
    #[sea_orm(column_name = "showPopup")]
    pub show_popup: bool,
    #[sea_orm(column_name = "isGoodNews")]
    pub is_good_news: bool,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::announcement_read::Entity")]
    AnnouncementRead,
}

impl Related<super::announcement_read::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::AnnouncementRead.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
