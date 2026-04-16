package com.oa.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.oa.backend.entity.ConstructionAttendance;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Mapper
public interface ConstructionAttendanceMapper extends BaseMapper<ConstructionAttendance> {

    /**
     * 项目内每个员工在指定区间的去重出勤天数（同一 employee+date 计 1 天）。
     * 返回 [{employeeId, days}, ...]
     */
    @Select("SELECT employee_id AS employeeId, COUNT(DISTINCT attendance_date) AS days "
            + "FROM construction_attendance "
            + "WHERE project_id = #{projectId} AND deleted = 0 "
            + "AND attendance_date BETWEEN #{startDate} AND #{endDate} "
            + "GROUP BY employee_id")
    List<Map<String, Object>> aggregatePerEmployee(@Param("projectId") Long projectId,
                                                    @Param("startDate") LocalDate startDate,
                                                    @Param("endDate") LocalDate endDate);

    /** 项目内总去重出勤人天 */
    @Select("SELECT COUNT(*) FROM ("
            + "SELECT DISTINCT employee_id, attendance_date FROM construction_attendance "
            + "WHERE project_id = #{projectId} AND deleted = 0 "
            + "AND attendance_date BETWEEN #{startDate} AND #{endDate}"
            + ") t")
    long totalManDays(@Param("projectId") Long projectId,
                      @Param("startDate") LocalDate startDate,
                      @Param("endDate") LocalDate endDate);
}
