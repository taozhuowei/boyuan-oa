package com.oa.backend.service;

import com.oa.backend.dto.ProjectCreateRequest;
import com.oa.backend.dto.ProjectMemberRequest;
import com.oa.backend.dto.ProjectUpdateRequest;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.Project;
import com.oa.backend.entity.ProjectMember;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.ProjectMapper;
import com.oa.backend.mapper.ProjectMemberMapper;
import com.oa.backend.service.impl.ProjectServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * ProjectServiceImpl 单元测试
 * 覆盖：创建项目、状态变更、添加成员、不将 pmId 写入 project 表
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("M2 - ProjectServiceImpl")
class ProjectServiceImplTest {

    @InjectMocks
    private ProjectServiceImpl service;

    @Mock
    private ProjectMapper projectMapper;

    @Mock
    private ProjectMemberMapper projectMemberMapper;

    @Mock
    private EmployeeMapper employeeMapper;

    // ─── create ──────────────────────────────────────────────

    @Test
    @DisplayName("create：新项目 status=ACTIVE，logCycleDays 默认 1")
    void create_normal_setsActiveStatus() {
        when(projectMapper.insert(any())).thenReturn(1);
        ProjectCreateRequest req = new ProjectCreateRequest("测试项目", LocalDate.now(), null);

        Project result = service.create(req);

        assertEquals("ACTIVE", result.getStatus());
        assertEquals(1, result.getLogCycleDays());
        assertEquals("测试项目", result.getName());
        assertNotNull(result.getCreatedAt());
        assertEquals(0, result.getDeleted());
    }

    @Test
    @DisplayName("create：logCycleDays 传入时使用传入值")
    void create_withLogCycleDays_usesProvidedValue() {
        when(projectMapper.insert(any())).thenReturn(1);
        ProjectCreateRequest req = new ProjectCreateRequest("项目B", null, 7);

        Project result = service.create(req);

        assertEquals(7, result.getLogCycleDays());
    }

    // ─── getById ─────────────────────────────────────────────

    @Test
    @DisplayName("getById：项目不存在（mapper 返回 null）时返回 null")
    void getById_notFound_returnsNull() {
        when(projectMapper.selectOne(any())).thenReturn(null);
        assertNull(service.getById(99L));
    }

    // ─── closeProject / reopenProject ────────────────────────

    @Test
    @DisplayName("closeProject：status 变为 CLOSED，actualEndDate 被设置")
    void closeProject_setsClosedStatus() {
        Project project = activeProject(1L);
        when(projectMapper.selectOne(any())).thenReturn(project);

        service.closeProject(1L);

        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectMapper).updateById(captor.capture());
        assertEquals("CLOSED", captor.getValue().getStatus());
        assertNotNull(captor.getValue().getActualEndDate());
    }

    @Test
    @DisplayName("reopenProject：status 变为 ACTIVE")
    void reopenProject_setsActiveStatus() {
        Project project = activeProject(1L);
        project.setStatus("CLOSED");
        when(projectMapper.selectOne(any())).thenReturn(project);

        service.reopenProject(1L);

        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectMapper).updateById(captor.capture());
        assertEquals("ACTIVE", captor.getValue().getStatus());
    }

    @Test
    @DisplayName("closeProject：项目不存在时抛出 IllegalArgumentException")
    void closeProject_notFound_throwsException() {
        when(projectMapper.selectOne(any())).thenReturn(null);
        assertThrows(IllegalArgumentException.class, () -> service.closeProject(99L));
    }

    // ─── delete ──────────────────────────────────────────────

    @Test
    @DisplayName("delete：软删除，设置 deleted=1")
    void delete_softDeletesProject() {
        Project project = activeProject(1L);
        when(projectMapper.selectOne(any())).thenReturn(project);

        service.delete(1L);

        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectMapper).updateById(captor.capture());
        assertEquals(1, captor.getValue().getDeleted());
    }

    // ─── addMember ───────────────────────────────────────────

    @Test
    @DisplayName("addMember：新成员正常插入，role=PM 不写 pmId 到 project 表")
    void addMember_pm_insertsWithoutWritingPmIdToProject() {
        when(projectMapper.selectOne(any())).thenReturn(activeProject(1L));
        when(employeeMapper.selectById(3L)).thenReturn(employee(3L));
        when(projectMemberMapper.selectOne(any())).thenReturn(null); // 无重复
        when(projectMemberMapper.insert(any())).thenReturn(1);

        ProjectMemberRequest req = new ProjectMemberRequest(3L, "PM");
        ProjectMember result = service.addMember(1L, req);

        assertEquals("PM", result.getRole());
        assertEquals(1L, result.getProjectId());
        assertEquals(3L, result.getEmployeeId());
        // project 表不应被 update（不写 pmId）
        verify(projectMapper, never()).updateById(any());
    }

    @Test
    @DisplayName("addMember：已存在且未删除的成员，抛出 IllegalArgumentException")
    void addMember_duplicateActive_throwsException() {
        when(projectMapper.selectOne(any())).thenReturn(activeProject(1L));
        when(employeeMapper.selectById(3L)).thenReturn(employee(3L));
        ProjectMember existing = new ProjectMember();
        existing.setDeleted(0);
        when(projectMemberMapper.selectOne(any())).thenReturn(existing);

        assertThrows(IllegalArgumentException.class,
            () -> service.addMember(1L, new ProjectMemberRequest(3L, "MEMBER")));
    }

    @Test
    @DisplayName("addMember：软删除成员重新添加时恢复，不重复插入")
    void addMember_softDeletedMember_restoresWithoutInsert() {
        when(projectMapper.selectOne(any())).thenReturn(activeProject(1L));
        when(employeeMapper.selectById(3L)).thenReturn(employee(3L));
        ProjectMember softDeleted = new ProjectMember();
        softDeleted.setDeleted(1);
        softDeleted.setRole("MEMBER");
        when(projectMemberMapper.selectOne(any())).thenReturn(softDeleted);

        service.addMember(1L, new ProjectMemberRequest(3L, "PM"));

        verify(projectMemberMapper, never()).insert(any());
        verify(projectMemberMapper).updateById(any());
    }

    @Test
    @DisplayName("addMember：员工不存在时抛出 IllegalArgumentException")
    void addMember_employeeNotFound_throwsException() {
        when(projectMapper.selectOne(any())).thenReturn(activeProject(1L));
        when(employeeMapper.selectById(99L)).thenReturn(null);

        assertThrows(IllegalArgumentException.class,
            () -> service.addMember(1L, new ProjectMemberRequest(99L, "MEMBER")));
    }

    // ─── helpers ─────────────────────────────────────────────

    private Project activeProject(Long id) {
        Project p = new Project();
        p.setId(id);
        p.setName("测试项目");
        p.setStatus("ACTIVE");
        p.setDeleted(0);
        return p;
    }

    private Employee employee(Long id) {
        Employee e = new Employee();
        e.setId(id);
        e.setName("测试员工");
        return e;
    }
}
