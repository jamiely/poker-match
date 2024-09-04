# intro

Tentatively titled "Poker Match", this is a drag to match style game where the
matches are poker-style hands. The valid hands are shown in the
instructions on the game page. Read more in this [blog article](https://polyglot.jamie.ly/programming/2015/04/11/poker-match.html).

This game uses the [Phaser game engine](http://phaser.io).

# Demo

https://jamiely.github.io/poker-match/

# dev

Installing new bower dependencies:

```bash
bower install --save package
grunt bowerInstall
```

Watch:
```bash
grunt
```

# production

```bash
grunt build
```

This puts the necessary files in `dist`, at which point 
I manually created an orphaned `gh-pages` branch and
commit the appropriate files.

# testing

Tests are written in Jasmine and run via Karma.

```bash
npm install -g karma-cli
karma start --single-run
```

# Media

* http://youtu.be/QNuY5AEaauA (v2.2.0)
* http://youtu.be/ukGjqbZ4NXg (v2.1.0)
