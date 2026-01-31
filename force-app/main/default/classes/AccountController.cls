public class AccountController {
    public List<Account> getAccounts() {
        return [SELECT Id, Name, Industry FROM Account LIMIT 20];
    }
}