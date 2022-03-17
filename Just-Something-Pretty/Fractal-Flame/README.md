This is an implementation of the Fractal flame algorithm as described in its original publication by Scott Draves: https://flam3.com/flame_draves.pdf.

If you are interested in a low-level implementation of it, just check these 2 C versions:
1) From Scott Draves: https://github.com/scottdraves/flam3.
2) From James Mccarty: https://github.com/jameswmccarty/Fractal-Flame-Algorithm-in-C.

To open this script use the link: https://htmlpreview.github.io/?https://github.com/Just-Roma/Web/blob/main/Just-Something-Pretty/Fractal-Flame/FractalFlame.html.

Since the creation process is computationally very slow, the main calculations are conducted in the background thread. An image is being created stepwise and becomes more well-defined and attractive in each new step. When you first open the link please don't think that it does not work, it just needs time to create a thread and make the first calculations. When you alredy see a red menu that means that it will probably take a few seconds(~2-3s) to show the first frame. After that the creation process becomes slightly faster. 
