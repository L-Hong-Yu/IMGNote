package com.imgnote.IMGNoteServer.bean;

import lombok.Data;

@Data
public class Pixel {

    private int x;

    private int y;

    private int r;

    private int g;

    private int b;

    private int a;

    public Pixel(int x, int y, int r, int g, int b, int a) {
        if (x > Constants.MAX_IMG_SIZE_INT || y > Constants.MAX_IMG_SIZE_INT) {
            throw new IllegalArgumentException("像素坐标超出范围");
        }
        this.x = x;
        this.y = y;
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    public Pixel(int x, int y) {
        if (x > Constants.MAX_IMG_SIZE_INT || y > Constants.MAX_IMG_SIZE_INT) {
            throw new IllegalArgumentException("像素坐标超出范围");
        }
        this.x = x;
        this.y = y;
    }

}
