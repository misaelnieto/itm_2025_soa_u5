use confik::Configuration;

#[derive(Debug, Default, Configuration)]
pub struct AjedrezConfig {
    pub server_addr: String,
    pub database_url: String,
}