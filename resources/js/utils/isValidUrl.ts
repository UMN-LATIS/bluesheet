export function isValidUrl(urlString: string) {
    try {
        new URL(urlString);
        return true;
    } catch (error) {
        return false;
    }
}
