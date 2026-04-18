package com.oa.backend.controller;

import com.oa.backend.dto.*;
import com.oa.backend.service.PositionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 岗位管理控制器
 */
@RestController
@RequestMapping("/positions")
@RequiredArgsConstructor
public class PositionController {

    private final PositionService positionService;

    /**
     * 获取岗位列表
     * 权限：CEO、HR、财务
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('CEO','HR','FINANCE')")
    public ResponseEntity<List<PositionResponse>> listPositions() {
        return ResponseEntity.ok(positionService.listPositions());
    }

    /**
     * 获取岗位详情（含等级和社保项目）
     * 权限：CEO、HR、财务
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CEO','HR','FINANCE')")
    public ResponseEntity<PositionResponse> getPosition(@PathVariable Long id) {
        return ResponseEntity.ok(positionService.getPosition(id));
    }

    /**
     * 创建岗位
     * 权限：CEO、HR
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('CEO','HR')")
    @com.oa.backend.annotation.OperationLogRecord(action = "POSITION_CREATE", targetType = "POSITION")
    public ResponseEntity<PositionResponse> createPosition(@RequestBody PositionUpsertRequest request) {
        PositionResponse response = positionService.createPosition(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 更新岗位
     * 权限：CEO、HR
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CEO','HR')")
    @com.oa.backend.annotation.OperationLogRecord(action = "POSITION_UPDATE", targetType = "POSITION")
    public ResponseEntity<PositionResponse> updatePosition(
            @PathVariable Long id,
            @RequestBody PositionUpsertRequest request) {
        return ResponseEntity.ok(positionService.updatePosition(id, request));
    }

    /**
     * 删除岗位（软删除）
     * 权限：CEO、HR
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CEO','HR')")
    @com.oa.backend.annotation.OperationLogRecord(action = "POSITION_DELETE", targetType = "POSITION")
    public ResponseEntity<Void> deletePosition(@PathVariable Long id) {
        positionService.deletePosition(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 获取岗位等级列表
     * 权限：CEO、HR、财务
     */
    @GetMapping("/{id}/levels")
    @PreAuthorize("hasAnyRole('CEO','HR','FINANCE')")
    public ResponseEntity<List<PositionLevelResponse>> listLevels(@PathVariable Long id) {
        return ResponseEntity.ok(positionService.listLevels(id));
    }

    /**
     * 创建岗位等级
     * 权限：CEO、HR
     */
    @PostMapping("/{id}/levels")
    @PreAuthorize("hasAnyRole('CEO','HR')")
    public ResponseEntity<PositionLevelResponse> createLevel(
            @PathVariable Long id,
            @RequestBody PositionLevelUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(positionService.createLevel(id, request));
    }

    /**
     * 更新岗位等级
     * 权限：CEO、HR
     */
    @PutMapping("/{id}/levels/{levelId}")
    @PreAuthorize("hasAnyRole('CEO','HR')")
    public ResponseEntity<PositionLevelResponse> updateLevel(
            @PathVariable Long id,
            @PathVariable Long levelId,
            @RequestBody PositionLevelUpsertRequest request) {
        return ResponseEntity.ok(positionService.updateLevel(id, levelId, request));
    }

    /**
     * 删除岗位等级（软删除）
     * 权限：CEO、HR
     */
    @DeleteMapping("/{id}/levels/{levelId}")
    @PreAuthorize("hasAnyRole('CEO','HR')")
    public ResponseEntity<Void> deleteLevel(@PathVariable Long id, @PathVariable Long levelId) {
        positionService.deleteLevel(id, levelId);
        return ResponseEntity.noContent().build();
    }
}
