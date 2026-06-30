# nectarhr-client

This template should help get you started developing with Vue 3 in Vite.

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup
You don't need to run the client.  Rather it is built to
static files in the `/dist` directory that server uses to return
the frontend. 

All you need to do is install the dependencies: 
```sh
npm install
```
Followed by building the client:
```sh
npm run build
```
Or for hot building as your developing:
```sh
npm run build-watch
```