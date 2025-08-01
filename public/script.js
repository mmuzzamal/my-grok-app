async function sendMessage() {
  const prompt = document.getElementById("prompt").value;
  const resBox = document.getElementById("response");
  resBox.textContent = "Thinking...";

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();
  resBox.textContent = data.response || "No response.";
}
