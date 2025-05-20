function includeHTML() {
  let elements = document.querySelectorAll("[w3-include-html]");

  elements.forEach(el => {
      let file = el.getAttribute("w3-include-html");

      if (file) {
          fetch(file)
              .then(response => {
                  if (!response.ok) throw new Error(`Failed to load ${file}`);
                  return response.text();
              })
              .then(data => {
                  el.innerHTML = data;

                  // Manually load player_cards.js AFTER inserting player_cards.html
                  let script = document.createElement("script");
                  script.src = "/juegos/balatro/js/player_cards.js";
                  document.body.appendChild(script);
              })
              .catch(error => console.error("Error loading file:", file, error));
      }
  });
}
