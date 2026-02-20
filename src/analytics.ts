export const GA_MEASUREMENT_ID = ''; // Configure GA4 ID here

export const isAnalyticsEnabled = () => {
    return localStorage.getItem('analytics_enabled') !== 'false';
};

export const setAnalyticsEnabled = (enabled: boolean) => {
    localStorage.setItem('analytics_enabled', String(enabled));
};

declare global {
    interface Window {
        dataLayer: any[];
        gtag: (...args: any[]) => void;
    }
}

export const initAnalytics = () => {
    if (!GA_MEASUREMENT_ID || !isAnalyticsEnabled()) return;

    try {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        // eslint-disable-next-line
        function gtag(..._args: any[]) { window.dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID, {
            send_page_view: false,
        });
        window.gtag = gtag as any;
    } catch (error) {
        console.warn('Analytics initialization failed (non-blocking).');
    }
};

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (!GA_MEASUREMENT_ID || !isAnalyticsEnabled() || typeof window.gtag !== 'function') return;

    try {
        window.gtag('event', eventName, params);
    } catch (e) {
        // fail silently
    }
};
