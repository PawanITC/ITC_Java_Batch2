package com.tribetalk.tribetalk.controller;

public class BridgePatternCircle extends BridgePatternShape {

    public BridgePatternCircle(BridgePatternColor color) {
        super(color);
    }

    @Override
    void draw() {
        System.out.println("Drawing Circle");
        color.applyColor();
    }


}
