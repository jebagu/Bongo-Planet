# Bongo Planet on GitHub

Public repository: **https://github.com/jebagu/Bongo-Planet**.

The public `main` branch starts with the current Bongo Planet source snapshot on 15 October 2026. It includes the game, local output bridge, runtime assets, composition files, documentation, research pages, tests, and the small support files used by those tests and diagnostic scripts.

The development checkout keeps its original Git history. That history includes diagnostic captures larger than GitHub's file-size limit. Raw measurement logs, recordings, traces, dependency installations, release bundles, the original NodeBeat reference ZIP, and the independently managed Sites publishing checkouts remain local. Historical evidence documents can refer to these retained local artifacts; their absence from the public repository does not change their recorded acceptance status. The Super Bongo Planet fork is separate.

## Run the public source

```sh
npm ci
npm run build
npm test
npm run dev
```

Open **http://127.0.0.1:5417/BongoPlanet/**. The port and path are the same as the development project. Run `npm run bridge` separately when testing the optional local output bridge. Browser and physical-device checks have their own requirements in the main README.

## Update the public snapshot

From the original development checkout:

```sh
node scripts/prepare-github-source.mjs
cd release/github/Bongo-Planet
npm ci
npm run build
npm test
git add .
git commit -m "Update Bongo Planet source"
git push origin main
```

The preparation script copies current working files, including new source files, into the independent public publishing checkout. It removes previously tracked public files that are no longer in the snapshot, keeps that checkout's Git history, and omits local credentials and generated captures. Review the public diff before pushing. GitHub publication does not deploy or change the audience of either existing Site.
