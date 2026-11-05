(function () {
    function initTocAccordion() {
        const toc = document.querySelector("#toc");
        if (!toc) return;

        // Éviter de créer plusieurs accordéons
        if (toc.querySelector(".toc-accordion")) return;

        const links = Array.from(
            toc.querySelectorAll("a[data-depth]")
        );

        if (!links.length) return;

        const accordion = document.createElement("div");
        accordion.className = "toc-accordion";

        let currentChildren = null;

        links.forEach(link => {
            const depth = link.dataset.depth;

            if (depth === "2") {
                const details = document.createElement("details");
                const summary = document.createElement("summary");

                summary.textContent = link.textContent.trim();

                details.appendChild(summary);

                currentChildren = document.createElement("div");
                currentChildren.className = "toc-children";

                details.appendChild(currentChildren);
                accordion.appendChild(details);

            } else if (depth === "3" && currentChildren) {
                const child = link.cloneNode(true);
                currentChildren.appendChild(child);
            }
        });

        if (!accordion.children.length) return;

        // Remplacer uniquement la liste des liens
        const list = links[0].parentElement;

        if (list && links.every(link => link.parentElement === list)) {
            links.forEach(link => link.remove());
            list.appendChild(accordion);
        }
    }

    document.addEventListener("DOMContentLoaded", initTocAccordion);

    // Gérer les changements de page sans rechargement
    const observer = new MutationObserver(() => {
        initTocAccordion();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();

/* Favicon personnalisé Sport-Ludique Chartres */

function setFavicon() {
    document.querySelectorAll('link[rel~="icon"]').forEach(
        element => element.remove()
    );

    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.type = "image/x-icon";
    favicon.href = "/favicon.ico?v=2";

    document.head.appendChild(favicon);
}

setFavicon();
