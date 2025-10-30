package com.tribetalk.tribetalk.controller;

public class BridgePatternTriangle extends BridgePatternShape {
    public BridgePatternTriangle(BridgePatternColor color) {
        super(color);
    }

    @Override
    void draw() {
        System.out.println("Drawing Triangle");
        color.applyColor();

    }
}
