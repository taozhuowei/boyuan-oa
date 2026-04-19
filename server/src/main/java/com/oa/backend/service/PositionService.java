package com.oa.backend.service;

import com.oa.backend.dto.*;
import java.util.List;

/** 岗位服务接口 */
public interface PositionService {

  /** 获取所有岗位列表 */
  List<PositionResponse> listPositions();

  /** 根据ID获取岗位详情（含等级和社保项目） */
  PositionResponse getPosition(Long id);

  /** 创建岗位 */
  PositionResponse createPosition(PositionUpsertRequest req);

  /** 更新岗位 */
  PositionResponse updatePosition(Long id, PositionUpsertRequest req);

  /** 删除岗位（软删除） */
  void deletePosition(Long id);

  /** 获取岗位的等级列表 */
  List<PositionLevelResponse> listLevels(Long positionId);

  /** 创建岗位等级 */
  PositionLevelResponse createLevel(Long positionId, PositionLevelUpsertRequest req);

  /** 更新岗位等级 */
  PositionLevelResponse updateLevel(Long positionId, Long levelId, PositionLevelUpsertRequest req);

  /** 删除岗位等级（软删除） */
  void deleteLevel(Long positionId, Long levelId);
}
