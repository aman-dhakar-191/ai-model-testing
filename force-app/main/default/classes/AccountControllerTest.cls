@isTest class AccountControllerTest {
    static testMethod void testGetAccounts() {
        Test.startTest();
        Account acc = new Account(Name='Test Account', Industry='Technology');
        insert acc;
        AccountController controller = new AccountController();
        List<Account> accounts = controller.getAccounts();
        System.assertEquals(1, accounts.size(), 'Should return inserted account');
        System.assertEquals(acc.Id, accounts[0].Id, 'Should return correct account');
        Test.stopTest();
    }
}