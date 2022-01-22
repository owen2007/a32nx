class A32NX_StateInitializer {
    constructor(flightPhaseManager) {
        this.flightPhaseManager = flightPhaseManager;
        this.autobrakeLevel = null;
        this.useManagedSpeed = null;
        this.selectedSpeed = null;
        this.selectedAlt = null;
        this.hasUnfrozen = null;
        this.pushedTRK = null;
    }

    init() {
        this.useManagedSpeed = SimVar.GetSimVarValue("L:A32NX_STATE_INIT_USE_MANAGED_SPEED", "Number");
        this.selectedSpeed = Math.max(140, SimVar.GetSimVarValue("L:A32NX_STATE_INIT_SELECTED_SPEED", "Number"));
        this.selectedAlt = Math.max(2000, SimVar.GetSimVarValue("L:A32NX_STATE_INIT_SELECTED_ALT", "Number"));
        this.autobrakeLevel = SimVar.GetSimVarValue("L:A32NX_STATE_INIT_AUTOBRK_LVL", "Number");
        this.hasUnfrozen = false;
        this.pushedTRK = false;
    }

    async update() {
        if (SimVar.GetSimVarValue("L:A32NX_STATE_INIT_ACTIVE", "Bool") !== 1) {
            return;
        }

        const ll_freeze_active = SimVar.GetSimVarValue("IS LATITUDE LONGITUDE FREEZE ON", "bool") === 1;
        const alt_freeze_active = SimVar.GetSimVarValue("IS ALTITUDE FREEZE ON", "bool") === 1;
        const att_freeze_active = SimVar.GetSimVarValue("IS ATTITUDE FREEZE ON", "bool") === 1;
        const all_freezes_active = ll_freeze_active && alt_freeze_active && att_freeze_active;

        const fd1_active = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR ACTIVE:1", "bool") === 1;
        const fd2_active = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR ACTIVE:2", "bool") === 1;
        const all_fd_active = fd1_active && fd2_active;

        if (!ll_freeze_active) {
            await SimVar.SetSimVarValue("K:FREEZE_LATITUDE_LONGITUDE_SET", "number", 1);
        }
        if (!alt_freeze_active) {
            await SimVar.SetSimVarValue("K:FREEZE_ALTITUDE_SET", "number", 1);
        }
        if (!att_freeze_active) {
            await SimVar.SetSimVarValue("K:FREEZE_ATTITUDE_SET", "number", 1);
        }

        if (fd1_active) {
            await SimVar.SetSimVarValue("K:TOGGLE_FLIGHT_DIRECTOR", "number", 1);
        }
        if (fd2_active) {
            await SimVar.SetSimVarValue("K:TOGGLE_FLIGHT_DIRECTOR", "number", 2);
        }

        if (all_freezes_active && !all_fd_active && SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_STATUS", "Number") === 0) {
            await this.setThrustLevers(45);
        }

        if (SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_STATUS", "Number") === 1) {
            console.log("Autothrust armed");
            await this.setThrustLevers(25);

            if (this.useManagedSpeed === 1) {
                await SimVar.SetSimVarValue("L:AIRLINER_V2_SPEED", "knots", 140);
                console.log("Set V2 speed!");
            } else {
                await SimVar.SetSimVarValue("K:A32NX.FCU_SPD_PULL", "number", 0);
                await SimVar.SetSimVarValue("K:A32NX.FCU_SPD_SET", "number", this.selectedSpeed);
                console.log("Set selected speed!");
            }
        }

        if (
            SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_STATUS", "Number") === 2
            && ((this.useManagedSpeed === 0 && SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_MODE", "Number") === 7 && SimVar.GetSimVarValue("L:A32NX_AUTOPILOT_SPEED_SELECTED", "Number") === this.selectedSpeed)
            || this.useManagedSpeed === 1)
        ) {
            // await SimVar.SetSimVarValue("L:A32NX_FMGC_FLIGHT_PHASE", "number", 5);
            this.flightPhaseManager.changeFlightPhase(FmgcFlightPhases.APPROACH);
            if (this.useManagedSpeed === 1) {
                await SimVar.SetSimVarValue("K:A32NX.FCU_SPD_PUSH", "number", 1);
                console.log("Set managed speed!");
                console.log("Flight phase: ", SimVar.GetSimVarValue("L:A32NX_FMGC_FLIGHT_PHASE", "number"));
                console.log("managed speed PFD: ", SimVar.GetSimVarValue("L:A32NX_SPEEDS_MANAGED_PFD", "knots"));
            }
            console.log("Autothrust active!");

            if (!this.pushedTRK && SimVar.GetSimVarValue("L:A32NX_TRK_FPA_MODE_ACTIVE", "number") === 0) {
                SimVar.SetSimVarValue("K:A32NX.FCU_TRK_FPA_TOGGLE_PUSH", "number", 1);
                this.pushedTRK = true;
                console.log("Pushed trk!");
            }

            if (!this.hasUnfrozen) {
                if (ll_freeze_active) {
                    SimVar.SetSimVarValue("K:FREEZE_LATITUDE_LONGITUDE_TOGGLE", "number", 1);
                }
                if (alt_freeze_active) {
                    SimVar.SetSimVarValue("K:FREEZE_ALTITUDE_TOGGLE", "number", 1);
                }
                if (att_freeze_active) {
                    SimVar.SetSimVarValue("K:FREEZE_ATTITUDE_TOGGLE", "number", 1);
                }
                console.log("UNFROZEN");
                this.hasUnfrozen = true;
            }

            SimVar.SetSimVarValue("L:A32NX_STATE_INIT_ACTIVE", "Bool", 0);
        }
    }

    async setThrustLevers(tlaPercent) {
        await Promise.all([
            SimVar.SetSimVarValue("L:A32NX_AUTOTHRUST_TLA:1", "Number", tlaPercent),
            SimVar.SetSimVarValue("L:A32NX_AUTOTHRUST_TLA:2", "Number", tlaPercent)
        ]);
        return;
    }
}
