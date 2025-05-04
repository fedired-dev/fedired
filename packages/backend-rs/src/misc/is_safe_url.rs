#[macros::export]
pub fn is_safe_url(url: &str) -> bool {
    if let Ok(url) = url.parse::<url::Url>() {
        if url.host_str().unwrap_or_default() == "unix"
            || !["http", "https"].contains(&url.scheme())
            || ![None, Some(80), Some(443)].contains(&url.port())
        {
            return false;
        }
        true
    } else {
        false
    }
}

#[cfg(test)]
mod unit_test {
    #[test]
    fn is_safe_url() {
        assert!(super::is_safe_url("http://github.com/fedired-dev/fedired"));
        assert!(super::is_safe_url("https://github.com/fedired-dev/fedired"));
        assert!(super::is_safe_url(
            "http://github.com:80/fedired-dev/fedired"
        ));
        assert!(super::is_safe_url(
            "https://github.com:80/fedired-dev/fedired"
        ));
        assert!(super::is_safe_url(
            "http://github.com:443/fedired-dev/fedired"
        ));
        assert!(super::is_safe_url(
            "https://github.com:443/fedired-dev/fedired"
        ));
        assert!(!super::is_safe_url("https://unix/fedired-dev/fedired"));
        assert!(!super::is_safe_url(
            "https://github.com:35/fedired-dev/fedired"
        ));
        assert!(!super::is_safe_url("ftp://github.com/fedired-dev/fedired"));
        assert!(!super::is_safe_url("nyaa"));
        assert!(!super::is_safe_url(""));
    }
}
