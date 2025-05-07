use rocket::serde::uuid::Uuid;
use rocket::{get, post, serde::json::Json};
use rocket_okapi::settings::UrlObject;
use rocket_okapi::{openapi, openapi_get_routes, rapidoc::*, swagger_ui::*};
use ws;
use ajedrez_svc::models::{SessionPlayers, AjedrezSession};

/// # Create new chess Session
#[openapi(tag = "Ajedrez")]
#[post("/api/v1/sessions", data = "<players>")]
fn api_create_session(players: Json<SessionPlayers>) -> Json<AjedrezSession> {
    let db_connection = &mut ajedrez_svc::db::establish_connection();
    Json(ajedrez_svc::db::create_session(db_connection, players.white_player, players.black_player))
}


/// # List sessions
#[openapi(tag = "Ajedrez")]
#[get("/api/v1/sessions")]
fn api_list_sessions() -> Json<std::vec::Vec<AjedrezSession>> {
    let db_connection = &mut ajedrez_svc::db::establish_connection();
    Json(ajedrez_svc::db::load_sessions(db_connection))
}


// # Chess session websocket for playing
#[openapi(tag = "Ajedrez")]
#[get("/api/v1/sessions/<_session_uid>")]
fn api_session_websocket(ws: ws::WebSocket, _session_uid: Uuid) -> ws::Channel<'static> {
    use rocket::futures::{SinkExt, StreamExt};

    ws.channel(move |mut stream| Box::pin(async move {
        while let Some(message) = stream.next().await {
            let _ = stream.send(message?).await;
        }

        Ok(())
    }))
}

#[openapi(tag = "Ajedrez")]
#[get("/echo?channel")]
fn echo_channel(ws: ws::WebSocket) -> ws::Channel<'static> {
    use rocket::futures::{SinkExt, StreamExt};

    ws.channel(move |mut stream| Box::pin(async move {
        while let Some(message) = stream.next().await {
            let _ = stream.send(message?).await;
        }

        Ok(())
    }))
}



#[rocket::main]
async fn main() {
    let launch_result = rocket::build()
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
        .await;
    match launch_result {
        Ok(_) => println!("Rocket shut down gracefully."),
        Err(err) => println!("Rocket had an error: {}", err),
    };
}