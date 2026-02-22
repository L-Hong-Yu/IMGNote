package com.imgnote.IMGNoteServer.utils;

public class ColorUtils {

    // 拆 ARGB
    public static int getA(int color) { return (color >> 24) & 0xFF; }
    public static int getR(int color) { return (color >> 16) & 0xFF; }
    public static int getG(int color) { return (color >>  8) & 0xFF; }
    public static int getB(int color) { return  color        & 0xFF; }

    // 合成
    public static int argb(int a, int r, int g, int b) {
        return (a & 0xFF) << 24
             | (r & 0xFF) << 16
             | (g & 0xFF) << 8
             | (b & 0xFF);
    }
}