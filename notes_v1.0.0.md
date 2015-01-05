Notes on v1.0.0
===============

After playing this game awhile using the current interaction mechanism,
which is similar to the one that Bejewled uses, which swaps the
positions of two adjacent pieces (it's actually closer to Tetris Attack
where the pieces stay switched), it seems like it's preferable to use
the Boggle system of matching, which requires the player to draw a line
across the pieces that match.

I'm at odds over whether to implement this type of matching first or to
improve the piece dropping logic, which fills in the board from the top
down. Having that kind of logic would allow me to start with a board
that doesn't have any existing matches, and also allow me to clear
matches proactively as they occur using new dropped pieces.

