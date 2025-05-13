use ajedrez_svc::models::{AjedrezSession, SessionPlayers};
use log::info;
use rocket::Config;
use rocket::serde::uuid::Uuid;
use rocket::{get, post, serde::json::Json};
use rocket_okapi::settings::UrlObject;
use rocket_okapi::{openapi, openapi_get_routes, rapidoc::*, swagger_ui::*};
use ws;

/// # Create new chess Session
#[openapi(tag = "Ajedrez", operation_id = "create")]
#[post("/api/ajedrez/sessions", data = "<players>")]
fn api_create_session(players: Json<SessionPlayers>) -> Json<AjedrezSession> {
    let db_connection = &mut ajedrez_svc::db::establish_connection();
    Json(ajedrez_svc::db::create_session(
        db_connection,
        players.white_player,
        players.black_player,
    ))
}

/// # List sessions
#[openapi(tag = "Ajedrez", operation_id = "list")]
#[get("/api/ajedrez/sessions")]
fn api_list_sessions() -> Json<std::vec::Vec<AjedrezSession>> {
    let db_connection = &mut ajedrez_svc::db::establish_connection();
    Json(ajedrez_svc::db::load_sessions(db_connection))
}

// # Chess session websocket for playing
#[openapi(tag = "Ajedrez", operation_id = "open")]
#[get("/api/ajedrez/sessions/<_session_uid>")]
fn api_session_websocket(ws: ws::WebSocket, _session_uid: Uuid) -> ws::Channel<'static> {
    use rocket::futures::{SinkExt, StreamExt};

    ws.channel(move |mut stream| {
        Box::pin(async move {
            while let Some(message) = stream.next().await {
                let _ = stream.send(message?).await;
            }

            Ok(())
        })
    })
}

#[openapi(tag = "Ajedrez")]
#[get("/echo?channel")]
fn echo_channel(ws: ws::WebSocket) -> ws::Channel<'static> {
    use rocket::futures::{SinkExt, StreamExt};

    ws.channel(move |mut stream| {
        Box::pin(async move {
            while let Some(message) = stream.next().await {
                let _ = stream.send(message?).await;
            }

            Ok(())
        })
    })
}

#[rocket::main]
async fn main() -> Result<(), rocket::Error> {
    env_logger::init();
    let config = Config {
        port: 7777,
        ..Config::debug_default()
    };
    info!("Arrancando el servidor de ajedrez");
    let _server = rocket::custom(&config)
        .mount(
            "/",
            openapi_get_routes![
                api_create_session,
                api_list_sessions,
                api_session_websocket,
                echo_channel,
            ],
        )
        .mount(
            "/swagger-ui/",
            make_swagger_ui(&SwaggerUIConfig {
                url: "../openapi.json".to_owned(),
                ..Default::default()
            }),
        )
        .mount(
            "/rapidoc/",
            make_rapidoc(&RapiDocConfig {
                general: GeneralConfig {
                    spec_urls: vec![UrlObject::new("General", "../openapi.json")],
                    ..Default::default()
                },
                hide_show: HideShowConfig {
                    allow_spec_url_load: false,
                    allow_spec_file_load: false,
                    ..Default::default()
                },
                ..Default::default()
            }),
        )
        .launch()
        .await?;

    Ok(())
}
