"use client"
import GoogleMap from "@/components/GoogleMap"
import StartDanusinButton from "@/components/StartDanusinButton"
import { usePocketBase } from "@/context/pocketbase"
import { useUser } from "@/context/user"
import { Tabs } from "antd"
import { useRouter } from "next/router"

const { TabPane } = Tabs

const OrganizationProductsNewPage = () => {
  const router = useRouter()
  const { id } = router.query
  const { pb } = usePocketBase()
  const { user } = useUser()

  const handleStartDanusin = () => {
    // Logic to start Danusin!
  }

  const handleTabChange = (key) => {
    // Logic to handle tab change
  }

  return (
    <main>
      <Tabs defaultActiveKey="1" onChange={handleTabChange}>
        <TabPane tab="Overview" key="1">
          {/* Overview content */}
        </TabPane>
        <TabPane tab="Products" key="2">
          {/* Products content */}
        </TabPane>
        <TabPane tab="Catalogs" key="3">
          {/* Catalogs content */}
        </TabPane>
        <TabPane tab="Members" key="4">
          {/* Members content */}
        </TabPane>
        <TabPane tab="Settings" key="5">
          {/* Settings content */}
        </TabPane>
      </Tabs>
      {user.role === "Admin" || user.role === "Moderator" ? (
        <div>{/* Product creation form */}</div>
      ) : (
        <div>{/* View-only content */}</div>
      )}
      {user.role === "Member" && <StartDanusinButton onClick={handleStartDanusin} />}
      {user.role === "Admin" && <GoogleMap />}
    </main>
  )
}

export default OrganizationProductsNewPage
