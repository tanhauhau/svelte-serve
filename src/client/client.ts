const socket = new WebSocket(`ws://${location.host}`);
socket.addEventListener("message", ({ data }) => {
  data = JSON.parse(data);
  console.log("received message:", data);

  switch (data.type) {
    case "connected":
      document.cookie = `__SVELTE_SERVE_ID__=${data.id};`;
      break;
    case "missing_dependencies":
      handleMissingDependencies(data);
      break;
    case "missing_dependencies_done":
      handleMissingDependenciesDone();
      break;
  }
});
socket.addEventListener("close", () => {
  console.log("Connection lost. Polling for restart...");
  setInterval(() => {
    const socket = new WebSocket(`ws://${location.host}`);
    socket.addEventListener("open", () => {
      location.reload();
    });
  }, 1000);
});

const HMR_MISSING_DEPENDENCIES = "hmr_missing_dependencies";
function handleMissingDependencies({ message, dependencies }: { message: string[]; dependencies: string[][] }) {
  const div = document.createElement("div");
  div.id = HMR_MISSING_DEPENDENCIES;
  div.innerHTML = `
    <div style="position: absolute; top: 0; bottom: 0; left: 0; right: 0; z-index: 999; background: #fff; padding: 20px; font-size: 18px;">
      <h1 style="color: #cc172c;">Missing dependencies</h1>
      <div>Reason:</div>
      <div>
        <ul>
          ${message.map((line) => `<li>${line.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />")}</li>`).join("")}
        </ul>
      </div>
      <div>Install them in your console:</div>
      <code style="margin-top: 18px; display: block; border: 1px #ddd solid; padding: 8px 16px;">yarn add ${dependencies
        .map((dep) => dep[0])
        .join(" ")}</code>
    </div>
  `;
  document.body.appendChild(div);
}
function handleMissingDependenciesDone() {
  const elem = document.querySelector("#" + HMR_MISSING_DEPENDENCIES);
  elem?.parentNode?.removeChild(elem);
}
