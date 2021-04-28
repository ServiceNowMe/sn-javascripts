//Quick Discovery Script
//IP Address as parameter
ar sysid = sn_discovery.DiscoveryAPI.discoverIpAddress("10.101.20.56");
gs.log(sysid );
gs.sleep(30000);
var ipResultObj = sn_discovery.DiscoveryAPI.reportCiIpAddressStatus("10.101.20.56", sysid);
gs.info("ipResultObj(cmdb): " + ipResultObj.getCmdbCI());
gs.info("ipResultObj(CiOperationStatus): " + ipResultObj.getCiOperationStatus());
gs.info("ipResultObj(discoveryState): " + ipResultObj.getDiscoveryState());
gs.info("ipResultObj(IpAddress): " + ipResultObj.getIpAddress());
gs.info("ipResultObj(issues): " + ipResultObj.getIssues());
gs.info("ipResultObj(issues_link): " + ipResultObj.getIssuesLink());
gs.info("ipResultObj(json): " + ipResultObj.toJson());
