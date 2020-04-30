const notFoundUrl = 'https://geoffspielman-com.nyc3.digitaloceanspaces.com/404/index.html';

async function handleRequest(request) {
  const parsedUrl = new URL(request.url)
  let path = parsedUrl.pathname

  const subdomain = parsedUrl.host.split('.').slice(0, -2).join('.');
  let domain;
  if (['', 'www'].includes(subdomain)) {
    let lastSegment = path.substring(path.lastIndexOf('/'))
    if (lastSegment.indexOf('.') === -1) {
      if (path[path.length - 1] !== '/') {
        path += '/'
      }
      path += 'index.html'
    }
    domain = 'https://geoffspielman-com.nyc3.digitaloceanspaces.com'
  }
  else if (['gameshow', 'www.gameshow'].includes(subdomain)) {
    let geoffLaptop = parsedUrl.searchParams.get('ip')
    let urlToUse = 'http://' + geoffLaptop + '?ip=' + geoffLaptop;
    return fetch(urlToUse)
  }
  else {
    return fetch(notFoundUrl);
  }
  res = await fetch(domain + path);
  if ([403, 404].includes(res.status)) {
    return fetch(notFoundUrl);
  }
  return res;
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
