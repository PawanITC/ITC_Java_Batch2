package com.tribetalk.tribetalk.controller;

public class BridgePattern {

    public static void main(String[] args) {

        BridgePatternShape redCircle=new BridgePatternCircle(new BridgePatternRedColor());
        redCircle.draw();
        BridgePatternShape blueTriangle=new BridgePatternTriangle(new BridgePatternBlueColor());
        blueTriangle.draw();

    }
}


