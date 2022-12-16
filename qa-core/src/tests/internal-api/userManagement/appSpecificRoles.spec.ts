import TestConfiguration from "../../../config/internal-api/TestConfiguration"
import { Application } from "@budibase/server/api/controllers/public/mapping/types"
import InternalAPIClient from "../../../config/internal-api/TestConfiguration/InternalAPIClient"
import { generateApp, appFromTemplate } from "../../../config/internal-api/fixtures/applications"
import { generateUser } from "../../../config/internal-api/fixtures/userManagement"
import { User } from "@budibase/types"
import { generateNewColumnForTable, generateTable } from "../../../config/internal-api/fixtures/table"
import generateScreen from "../../../config/internal-api/fixtures/screens"
import { db } from "@budibase/backend-core"

describe("Internal API - App Specific Roles & Permissions", () => {
    const api = new InternalAPIClient()
    const config = new TestConfiguration<Application>(api)

    // Before each test, login as admin. Some tests will require login as a different user
    beforeEach(async () => {
        await config.loginAsAdmin()
    })

    afterAll(async () => {
        await config.afterAll()
    })

    it("Add BASIC user to app", async () => {
        const appUser = generateUser()
        expect(appUser[0].builder?.global).toEqual(false)
        expect(appUser[0].admin?.global).toEqual(false)
        const [createUserResponse, createUserJson] = await config.users.addMultiple(appUser)

        const app = await config.applications.create(appFromTemplate())
        config.applications.api.appId = app.appId

        const [userInfoResponse, userInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
        const body: User = {
            ...userInfoJson,
            roles: {
                [<string>app.appId]: "BASIC",
            }
        }
        await config.users.updateInfo(body)

        const [changedUserInfoResponse, changedUserInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
        expect(changedUserInfoJson.roles[<string>app.appId]).toBeDefined()
        expect(changedUserInfoJson.roles[<string>app.appId]).toEqual("BASIC")

    })

    it("Add ADMIN user to app", async () => {
        const adminUser = generateUser(1, "admin")
        expect(adminUser[0].builder?.global).toEqual(true)
        expect(adminUser[0].admin?.global).toEqual(true)
        const [createUserResponse, createUserJson] = await config.users.addMultiple(adminUser)

        //const app = await config.applications.create(generateApp())
        //config.applications.api.appId = app.appId

        const app = await config.applications.create(appFromTemplate())
        config.applications.api.appId = app.appId

        const [userInfoResponse, userInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
        const body: User = {
            ...userInfoJson,
            roles: {
                [<string>app.appId]: "ADMIN",
            }
        }
        await config.users.updateInfo(body)

        const [changedUserInfoResponse, changedUserInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
        expect(changedUserInfoJson.roles[<string>app.appId]).toBeDefined()
        expect(changedUserInfoJson.roles[<string>app.appId]).toEqual("ADMIN")

        // publish app
        await config.applications.publish(<string>app.url)
        // check published app renders
        config.applications.api.appId = db.getProdAppID(app.appId!)
        await config.applications.canRender()

    })

    it("Add POWER user to app", async () => {
        const powerUser = generateUser(1, 'developer')
        expect(powerUser[0].builder?.global).toEqual(true)

        const [createUserResponse, createUserJson] = await config.users.addMultiple(powerUser)

        const app = await config.applications.create(generateApp())
        config.applications.api.appId = app.appId

        const [userInfoResponse, userInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
        const body: User = {
            ...userInfoJson,
            roles: {
                [<string>app.appId]: "POWER",
            }
        }
        await config.users.updateInfo(body)

        const [changedUserInfoResponse, changedUserInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
        expect(changedUserInfoJson.roles[<string>app.appId]).toBeDefined()
        expect(changedUserInfoJson.roles[<string>app.appId]).toEqual("POWER")

    })

    describe("Check Access for default roles", () => {
        it("Check Table access for app user", async () => {
            const appUser = generateUser()
            expect(appUser[0].builder?.global).toEqual(false)
            expect(appUser[0].admin?.global).toEqual(false)
            const [createUserResponse, createUserJson] = await config.users.addMultiple(appUser)

            const app = await config.applications.create(generateApp())
            config.applications.api.appId = app.appId

            const [userInfoResponse, userInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
            const body: User = {
                ...userInfoJson,
                roles: {
                    [<string>app.appId]: "BASIC",
                }
            }
            await config.users.updateInfo(body)

            const [changedUserInfoResponse, changedUserInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
            expect(changedUserInfoJson.roles[<string>app.appId]).toBeDefined()
            expect(changedUserInfoJson.roles[<string>app.appId]).toEqual("BASIC")

            const [createdTableResponse, createdTableData] = await config.tables.save(
                generateTable()
            )
            await config.login(<string>appUser[0].email, <string>appUser[0].password)
            const newColumn = generateNewColumnForTable(createdTableData)
            await config.tables.forbiddenSave(
                newColumn)
            await config.tables.forbiddenSave(generateTable())
        })

        it("Check Table access for developer", async () => {
            const developer = generateUser(1, 'developer')
            expect(developer[0].builder?.global).toEqual(true)

            const [createUserResponse, createUserJson] = await config.users.addMultiple(developer)

            const app = await config.applications.create(generateApp())
            config.applications.api.appId = app.appId

            const [userInfoResponse, userInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
            const body: User = {
                ...userInfoJson,
                roles: {
                    [<string>app.appId]: "POWER",
                }
            }
            await config.users.updateInfo(body)

            const [changedUserInfoResponse, changedUserInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
            expect(changedUserInfoJson.roles[<string>app.appId]).toBeDefined()
            expect(changedUserInfoJson.roles[<string>app.appId]).toEqual("POWER")

            const [createdTableResponse, createdTableData] = await config.tables.save(
                generateTable()
            )
            await config.login(<string>developer[0].email, <string>developer[0].password)
            const newColumn = generateNewColumnForTable(createdTableData)
            const [addColumnResponse, addColumnData] = await config.tables.save(
                newColumn,
                true
            )
        })

        it("Check Table access for admin", async () => {
            const adminUser = generateUser(1, "admin")
            expect(adminUser[0].builder?.global).toEqual(true)
            expect(adminUser[0].admin?.global).toEqual(true)
            const [createUserResponse, createUserJson] = await config.users.addMultiple(adminUser)

            const app = await config.applications.create(generateApp())
            config.applications.api.appId = app.appId

            const [userInfoResponse, userInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
            const body: User = {
                ...userInfoJson,
                roles: {
                    [<string>app.appId]: "ADMIN",
                }
            }
            await config.users.updateInfo(body)

            const [changedUserInfoResponse, changedUserInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
            expect(changedUserInfoJson.roles[<string>app.appId]).toBeDefined()
            expect(changedUserInfoJson.roles[<string>app.appId]).toEqual("ADMIN")

            await config.login(<string>adminUser[0].email, <string>adminUser[0].password)
            const [createdTableResponse, createdTableData] = await config.tables.save(
                generateTable()
            )
            const newColumn = generateNewColumnForTable(createdTableData)
            const [addColumnResponse, addColumnData] = await config.tables.save(
                newColumn,
                true
            )
        })
    })

    describe("Screen Access for App specific roles", () => {
        it("Check Screen access for BASIC Role", async () => {
            // Set up user
            const appUser = generateUser()
            expect(appUser[0].builder?.global).toEqual(false)
            expect(appUser[0].admin?.global).toEqual(false)
            const [createUserResponse, createUserJson] = await config.users.addMultiple(appUser)

            // Create App
            const app = await config.applications.create(generateApp())
            config.applications.api.appId = app.appId

            // Update user roles
            const [userInfoResponse, userInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
            const prodAppId = db.getProdAppID(app.appId!)

            // Roles must always be set with prod appID
            const body: User = {
                ...userInfoJson,
                roles: {
                    [prodAppId]: "BASIC",
                }
            }
            await config.users.updateInfo(body)

            const [changedUserInfoResponse, changedUserInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
            expect(changedUserInfoJson.roles[prodAppId]).toBeDefined()
            expect(changedUserInfoJson.roles[prodAppId]).toEqual("BASIC")

            await config.screen.create(generateScreen("BASIC"))
            await config.screen.create(generateScreen("POWER"))
            await config.screen.create(generateScreen("ADMIN"))

            await config.applications.publish(<string>app.url)
            const [firstappPackageResponse, firstappPackageJson] = await config.applications.getAppPackage(<string>app.appId)
            expect(firstappPackageJson.screens).toBeDefined()
            expect(firstappPackageJson.screens.length).toEqual(3)

            // login with BASIC user
            await config.login(appUser[0].email!, appUser[0].password!)
            const [selfInfoResponse, selfInfoJson] = await config.users.getSelf()

            // fetch app package
            const [appPackageResponse, appPackageJson] = await config.applications.getAppPackage(app.appId!)
            expect(appPackageJson.screens).toBeDefined()
            expect(appPackageJson.screens.length).toEqual(1)
            expect(appPackageJson.screens[0].routing.roleId).toEqual("BASIC")
        })

        it("Check Screen access for POWER role", async () => {
            const appUser = generateUser()
            expect(appUser[0].builder?.global).toEqual(false)
            expect(appUser[0].admin?.global).toEqual(false)
            const [createUserResponse, createUserJson] = await config.users.addMultiple(appUser)

            const app = await config.applications.create(generateApp())

            config.applications.api.appId = app.appId

            const [userInfoResponse, userInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
            const body: User = {
                ...userInfoJson,
                roles: {
                    [app.appId!]: "POWER",
                }
            }
            await config.users.updateInfo(body)

            const [changedUserInfoResponse, changedUserInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
            expect(changedUserInfoJson.roles[app.appId!]).toBeDefined()
            expect(changedUserInfoJson.roles[app.appId!]).toEqual("POWER")

            await config.screen.create(generateScreen("BASIC"))
            await config.screen.create(generateScreen("POWER"))
            await config.screen.create(generateScreen("ADMIN"))

            await config.applications.publish(<string>app.url)
            const [firstappPackageResponse, firstappPackageJson] = await config.applications.getAppPackage(app.appId!)
            expect(firstappPackageJson.screens).toBeDefined()
            expect(firstappPackageJson.screens.length).toEqual(3)

            await config.login(appUser[0].email!, appUser[0].password!)
            const [appPackageResponse, appPackageJson] = await config.applications.getAppPackage(<string>app.appId)
            expect(appPackageJson.screens).toBeDefined()
            expect(appPackageJson.screens.length).toEqual(2)
        })

        it("Check Screen access for ADMIN role", async () => {
            const appUser = generateUser()
            expect(appUser[0].builder?.global).toEqual(false)
            expect(appUser[0].admin?.global).toEqual(false)
            const [createUserResponse, createUserJson] = await config.users.addMultiple(appUser)

            const app = await config.applications.create(generateApp())
            config.applications.api.appId = app.appId

            const [userInfoResponse, userInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
            const body: User = {
                ...userInfoJson,
                roles: {
                    [<string>app.appId]: "ADMIN",
                }
            }
            await config.users.updateInfo(body)

            const [changedUserInfoResponse, changedUserInfoJson] = await config.users.getInfo(createUserJson.created.successful[0]._id)
            expect(changedUserInfoJson.roles[<string>app.appId]).toBeDefined()
            expect(changedUserInfoJson.roles[<string>app.appId]).toEqual("ADMIN")
        })
    })
    describe.skip("Screen Access for custom roles", () => {
        it("Custom role access for level 1 permissions", async () => { })
        it("Custom role access for level 2 permissions", async () => { })
        it("Custom role access for level 3 permissions", async () => { })
        it("Custom role access for level 4 permissions", async () => { })
        it("Custom role access for level 5 permissions", async () => { })
    })

})
