package com.oa.backend.dto;

/**
 * 创建导出任务请求 DTO
 * <p>
 * 接收前端传入的时间范围参数。startDate / endDate 仅供展示或日志用途，
 * 不持久化至数据库（export_backup_task 表无对应列）。
 *
 * @param startDate 导出数据起始日期，格式 yyyy-MM-dd
 * @param endDate   导出数据截止日期，格式 yyyy-MM-dd
 */
public record ExportTaskCreateRequest(
    String startDate,
    String endDate
) {
}
