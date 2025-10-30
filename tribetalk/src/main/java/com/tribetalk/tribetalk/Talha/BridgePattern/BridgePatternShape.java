package com.tribetalk.tribetalk.controller;

public abstract class BridgePatternShape {
    protected BridgePatternColor color;
    public BridgePatternShape(BridgePatternColor color) {
        this.color = color;
    }
    protected BridgePatternColor getColor() {
        return color;
    }
    abstract void draw();
}
