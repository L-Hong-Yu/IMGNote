package com.imgnote.IMGNoteServer.bean;

import lombok.Data;

@Data
public class Img {

    private int width;

    private int height;

    private long maxContentLen;

    private int[] pixels;

    public Img(int width, int height, long maxContentLen, int[] pixels) {
        this.width = width;
        this.height = height;
        this.maxContentLen = maxContentLen;
        this.pixels = pixels;
    }

}
