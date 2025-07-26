document.getElementById('fileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const res = await fetch('/upload', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  showResult(data.imageUrl);
});

document.getElementById('urlForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = e.target.imageUrl.value;

  const res = await fetch('/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl: url })
  });

  const data = await res.json();
  showResult(data.imageUrl);
});

function showResult(url) {
  document.getElementById('result').classList.remove('hidden');
  document.getElementById('imageLink').value = url;
}

function copyURL() {
  const input = document.getElementById('imageLink');
  input.select();
  document.execCommand('copy');
  alert('URL Copied!');
}
