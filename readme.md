[![Known Vulnerabilities](https://snyk.io/test/github/jfoclpf/delp/badge.svg?targetFile=package.json)](https://snyk.io/test/github/jfoclpf/delp?targetFile=package.json)
[![js-standard-style][js-standard-style_img]][js-standard-style_url]

[js-standard-style_img]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[js-standard-style_url]: https://standardjs.com/

# Dicionário Em-Linha de Português (DELP)

This is a meta and simple portuguese dictionary that uses jsdom to fetch the meanings of the words from the most renowned dictionaries, and cleans the meaning from visual garbage and visual noise

## Install as local service

Clone it, install dependencies and start the http server

```
git clone https://github.com/jfoclpf/delp
cd delp
npm ci
npm start
```

It will open a http server which you can access with your browser at `http://localhost:3038`

## Install as webservice

```
git clone https://github.com/jfoclpf/delp
cd delp
npm install
node server.js --host <mydomain.pt>
```

