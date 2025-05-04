use crate::config::server::VERSION;

const GREETING_MESSAGE: &str = "\
███████╗███████╗██████╗ ██╗██████╗ ███████╗██████╗ 
██╔════╝██╔════╝██╔══██╗██║██╔══██╗██╔════╝██╔══██╗
█████╗  █████╗  ██║  ██║██║██████╔╝█████╗  ██║  ██║
██╔══╝  ██╔══╝  ██║  ██║██║██╔══██╗██╔══╝  ██║  ██║
██║     ███████╗██████╔╝██║██║  ██║███████╗██████╔╝
╚═╝     ╚══════╝╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝╚═════╝ 

 Fedired is an open-source decentralized microblogging platform.
 If you like Fedired, please consider contributing to the repo. https://fedired.example.com
";

/// Prints the greeting message and the Fedired version to stdout.
#[macros::export]
pub fn greet() {
    println!("{}", GREETING_MESSAGE);

    tracing::info!("Welcome to Fedired!");
    tracing::info!("Fedired v{VERSION}");
}
