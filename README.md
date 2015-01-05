# intro

Tentatively titled "Poker Match", this is a match-3 style game where the
matches are poker-style hands. The valid hands are shown in the
instructions on the game page.

This game uses the [Phaser game engine](http://phaser.io).

# dev

Installing new bower dependencies:

```bash
bower install --save package
grunt wiredep
```

# production

I just manually change the dependencies to CDN versions when I create
the `gh-pages` branch.

# testing

Tests are written in Jasmine and run via Karma.

```bash
npm install -g karma-cli
karma start --single-run
```

