use config::Config;
use anyhow::Result;


pub fn get_configuration() -> Result<Config>{
    let cfg = Config::builder()
        .add_source(config::Environment::with_prefix("AJEDREZ"))
        .build()?;
    Ok(cfg)
}
