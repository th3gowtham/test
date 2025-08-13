import React, { useState } from "react";
import Sidebar from "../admin/components/sidebar";
import Navbar from "../admin/components/navbar";
import Dashboard from "../admin/components/dashboard";
import CoursesManagement from "../admin/components/courses-management";
import UserManagement from "../admin/components/user-management";
import TeacherManagement from "../admin/components/teacher-management";
import ChatAssignment from "../admin/components/chat-assignment";
import BatchAssignment from "../admin/components/batch-assignment";
import EnrollmentsManagement from "../admin/components/enrollments-management";
import "../admin/admin_globals.css";

export default function AdminDashboard() {
  const [activeRoute, setActiveRoute] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeRoute) {
      case "dashboard":
        return <Dashboard />;
      case "courses":
        return <CoursesManagement />;
      case "users":
        return <UserManagement />;
      case "teachers":
        return <TeacherManagement />;
      case "chat-assignment":
        return <ChatAssignment />;
      case "batch-assignment":
        return <BatchAssignment />;
      case "events":
        return <EnrollmentsManagement />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar
        activeRoute={activeRoute}
        setActiveRoute={setActiveRoute}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Navbar />
        <div className="content-area">{renderContent()}</div>
      </div>
    </div>
  );
}