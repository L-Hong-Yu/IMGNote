package com.imgnote.IMGNoteServer.cache;

import com.imgnote.IMGNoteServer.bean.NoteBook;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 图片解析缓存管理器
 */
@Slf4j
public class CacheManager {

    // 缓存阈值
    private static final long CACHE_THRESHOLD = (long) (1024 * 1024 * 0.2);

    // 缓存存储结构：图片MD5 -> 解析结果
    private static final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    /**
     * 缓存条目类
     */
    @Getter
    public static class CacheEntry {

        private final NoteBook noteBook;

        public CacheEntry(NoteBook noteBook) {
            this.noteBook = noteBook;
        }
    }

    /**
     * 检查是否存在指定MD5的缓存
     */
    public static boolean exists(String imageMd5) {
        return cache.containsKey(imageMd5);
    }

    /**
     * 获取缓存条目
     */
    public static CacheEntry get(String imageMd5) {

        return cache.get(imageMd5);
    }

    /**
     * 添加缓存条目
     */
    public static void put(String imageMd5, NoteBook noteBook) {
        // 只有数据大小超过阈值才缓存
        long dataSize = noteBook.getData().length();
        if (noteBook.getData().length() >= CACHE_THRESHOLD) {
            cache.put(imageMd5, new CacheEntry(noteBook));
            log.info("添加缓存, 数据大小: {}", dataSize);
        } else {
            log.info("数据大小 {} 未达到缓存阈值 {} ，跳过缓存 ", dataSize, CACHE_THRESHOLD);
        }
    }

    /**
     * 清除缓存
     */
    public static void remove(String imageMd5) {
        cache.remove(imageMd5);
    }

    /**
     * 清除所有缓存
     */
    public static void clear() {
        cache.clear();
        log.info("缓存已清空");
    }

    /**
     * 获取缓存统计信息
     */
    public static String getCacheStats() {
        return String.format("当前缓存条目数: %d", cache.size());
    }
}
