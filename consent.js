const CONSENT_STORAGE_KEY = "christian-plinke-consent-v1";
const defaultConsent = {
    externalMedia: false,
};

const getStoredConsent = () => {
    try {
        const storedValue = window.localStorage.getItem(CONSENT_STORAGE_KEY);
        if (!storedValue) {
            return null;
        }

        const parsedValue = JSON.parse(storedValue);
        return {
            ...defaultConsent,
            ...parsedValue,
        };
    } catch (error) {
        return null;
    }
};

const saveConsent = (consent) => {
    window.localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify({
            ...defaultConsent,
            ...consent,
            updatedAt: new Date().toISOString(),
        }),
    );
};

const thumbnailWrappers = Array.from(document.querySelectorAll("[data-consent-thumbnail-wrapper]"));
const embedContainers = Array.from(document.querySelectorAll("[data-consent-embed]"));
const consentBanner = document.querySelector("[data-consent-banner]");
const consentPanel = document.querySelector("[data-consent-panel]");
const consentBackdrop = document.querySelector("[data-consent-backdrop]");
const openConsentButtons = Array.from(document.querySelectorAll("[data-open-consent]"));
const closeConsentButton = document.querySelector("[data-close-consent]");
const consentActionButtons = Array.from(document.querySelectorAll("[data-consent-action]"));
const inlineConsentButtons = Array.from(document.querySelectorAll("[data-consent-inline-enable]"));
const consentToggle = document.querySelector("[data-consent-toggle='externalMedia']");
const privacyFab = document.querySelector(".privacy-settings-fab");
const portfolioAudioPlayer = document.querySelector("[data-portfolio-audio-player]");
const portfolioAudioButtons = Array.from(document.querySelectorAll("[data-audio-trigger]"));

const showElement = (element) => {
    if (element) {
        element.classList.remove("is-hidden");
    }
};

const hideElement = (element) => {
    if (element) {
        element.classList.add("is-hidden");
    }
};

const openConsentPanel = () => {
    showElement(consentPanel);
    showElement(consentBackdrop);
};

const closeConsentPanel = () => {
    hideElement(consentPanel);
    hideElement(consentBackdrop);
};

const syncToggle = (consent) => {
    if (consentToggle) {
        consentToggle.checked = Boolean(consent.externalMedia);
    }
};

const applyThumbnailConsent = (isEnabled) => {
    thumbnailWrappers.forEach((wrapper) => {
        const image = wrapper.querySelector("[data-consent-thumbnail]");
        if (!image) {
            return;
        }

        if (isEnabled) {
            if (!image.getAttribute("src")) {
                image.setAttribute("src", image.dataset.src || "");
            }
            wrapper.classList.add("is-loaded");
            return;
        }

        image.removeAttribute("src");
        wrapper.classList.remove("is-loaded");
    });
};

const applyEmbedConsent = (isEnabled) => {
    embedContainers.forEach((container) => {
        const iframe = container.querySelector("[data-consent-iframe]");
        if (!iframe) {
            return;
        }

        if (isEnabled) {
            if (!iframe.getAttribute("src")) {
                iframe.setAttribute("src", iframe.dataset.src || "");
            }
            container.classList.add("is-loaded");
            return;
        }

        iframe.removeAttribute("src");
        container.classList.remove("is-loaded");
    });
};

const applyConsent = (consent, options = {}) => {
    const hideBannerAfterApply = options.hideBanner !== false;
    const showPrivacyFabAfterApply = options.showPrivacyFab !== false;
    const normalizedConsent = {
        ...defaultConsent,
        ...consent,
    };

    syncToggle(normalizedConsent);
    applyThumbnailConsent(normalizedConsent.externalMedia);
    applyEmbedConsent(normalizedConsent.externalMedia);

    document.documentElement.dataset.externalMediaConsent = normalizedConsent.externalMedia ? "granted" : "denied";

    if (hideBannerAfterApply) {
        hideElement(consentBanner);
    } else {
        showElement(consentBanner);
    }

    if (showPrivacyFabAfterApply) {
        showElement(privacyFab);
    } else {
        hideElement(privacyFab);
    }
};

const setConsent = (consent) => {
    saveConsent(consent);
    applyConsent(consent);
    closeConsentPanel();
};

const rejectOptionalServices = () => {
    setConsent({
        externalMedia: false,
    });
};

const acceptExternalMedia = () => {
    setConsent({
        externalMedia: true,
    });
};

const resetPortfolioAudioButtons = () => {
    portfolioAudioButtons.forEach((button) => {
        button.classList.remove("is-playing");
        button.setAttribute("aria-pressed", "false");

        const audioTitle = button.dataset.audioTitle || "audio preview";
        button.setAttribute("aria-label", `Play audio preview for ${audioTitle}`);
    });
};

const stopPortfolioAudio = () => {
    if (!portfolioAudioPlayer) {
        return;
    }

    portfolioAudioPlayer.pause();
    portfolioAudioPlayer.currentTime = 0;
    resetPortfolioAudioButtons();
};

portfolioAudioButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!portfolioAudioPlayer) {
            return;
        }

        const audioSource = button.dataset.audioSrc;
        if (!audioSource) {
            return;
        }

        const isCurrentlyPlaying =
            portfolioAudioPlayer.getAttribute("src") === audioSource && !portfolioAudioPlayer.paused;

        if (isCurrentlyPlaying) {
            stopPortfolioAudio();
            return;
        }

        resetPortfolioAudioButtons();

        if (portfolioAudioPlayer.getAttribute("src") !== audioSource) {
            portfolioAudioPlayer.setAttribute("src", audioSource);
            portfolioAudioPlayer.load();
        }

        const playPromise = portfolioAudioPlayer.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
                resetPortfolioAudioButtons();
            });
        }

        button.classList.add("is-playing");
        button.setAttribute("aria-pressed", "true");
        button.setAttribute("aria-label", `Pause audio preview for ${button.dataset.audioTitle || "audio preview"}`);
    });
});

if (portfolioAudioPlayer) {
    portfolioAudioPlayer.addEventListener("ended", resetPortfolioAudioButtons);
    portfolioAudioPlayer.addEventListener("pause", () => {
        if (portfolioAudioPlayer.ended) {
            return;
        }

        resetPortfolioAudioButtons();
    });
}

openConsentButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const storedConsent = getStoredConsent() || defaultConsent;
        syncToggle(storedConsent);
        openConsentPanel();
    });
});

if (closeConsentButton) {
    closeConsentButton.addEventListener("click", closeConsentPanel);
}

if (consentBackdrop) {
    consentBackdrop.addEventListener("click", closeConsentPanel);
}

consentActionButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const action = button.dataset.consentAction;

        if (action === "accept") {
            acceptExternalMedia();
            return;
        }

        if (action === "reject") {
            rejectOptionalServices();
            return;
        }

        if (action === "open-settings") {
            openConsentPanel();
            return;
        }

        if (action === "save") {
            setConsent({
                externalMedia: Boolean(consentToggle?.checked),
            });
        }
    });
});

inlineConsentButtons.forEach((button) => {
    button.addEventListener("click", () => {
        acceptExternalMedia();
    });
});

const initialConsent = getStoredConsent();

if (initialConsent) {
    applyConsent(initialConsent, {
        hideBanner: false,
        showPrivacyFab: false,
    });
} else {
    applyThumbnailConsent(false);
    applyEmbedConsent(false);
    showElement(consentBanner);
    hideElement(privacyFab);
    syncToggle(defaultConsent);
}
