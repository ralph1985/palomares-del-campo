const videoButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-video-load]'));

for (const button of videoButtons) {
  button.addEventListener('click', () => {
    const frame = button.closest<HTMLElement>('[data-video-frame]');
    const videoId = button.dataset.videoId;
    const title = button.dataset.videoTitle;

    if (!frame || !videoId || !/^[\w-]{11}$/.test(videoId) || !title) return;

    const iframe = document.createElement('iframe');
    iframe.src = new URL(`/embed/${videoId}?autoplay=1`, 'https://www.youtube-nocookie.com').href;
    iframe.title = title;
    iframe.loading = 'eager';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    frame.replaceChildren(iframe);
  });
}
