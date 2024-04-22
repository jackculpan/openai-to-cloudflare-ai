let prompt = "";
let style = "";

document.addEventListener('DOMContentLoaded', function () {
  const target = document.getElementById('ai-content')
  target.style.display = 'none'; // Hide the ai-content initially
  const button = document.querySelector('#input-form button');

  document.getElementById('input-form').addEventListener('submit', async function (event) {
    event.preventDefault()
    button.disabled = true;
    const formData = new FormData(event.target)
    const query = formData.get('query')
    const selectedStyle = formData.get('style')
    prompt = query;
    style = selectedStyle;
    await fetchChunked(target)
    button.disabled = false;
  })

  // fetch('/api/images')
  //   .then(response => response.json())
  //   .then(images => {
  //     const gallery = document.getElementById('gallery');
  //     images.forEach((base64Image, index) => {
  //       const img = document.createElement('img');
  //       img.src = `data:image/png;base64,${base64Image}`;
  //       img.alt = `AI Art Example ${index + 1}`;
  //       img.style.width = 'calc(20% - 10px)';
  //       img.style.height = 'auto';
  //       img.style.margin = '5px';
  //       img.loading = 'lazy';
  //       gallery.appendChild(img);
  //     });
  //   })
  //   .catch(error => console.error('Error loading images:', error));

})

async function fetchChunked(target) {
  target.innerHTML = 'generating...'
  target.style.display = 'block'; // Show the ai-content when loading starts
  const response = await fetch('/ai', {
    method: 'post',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ prompt, style })
  })

  const text = await response.text();

  target.innerHTML = `<img loading="lazy" alt="${prompt}" src="${text}" />`;
  // const twitterButton = document.createElement('a');
  // twitterButton.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(prompt)}&url=${encodeURIComponent(text)}`;
  // twitterButton.textContent = 'Share on Twitter';
  // twitterButton.classList.add('twitter-share-button');
  // target.appendChild(twitterButton);
  return;

}
