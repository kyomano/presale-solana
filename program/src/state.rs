use solana_program::{
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};

use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};

pub struct TokenSaleProgramData {
    pub is_initialized: bool,
    pub seller_pubkey: Pubkey,
    pub temp_token_account_pubkey: Pubkey,
    pub per_token_price: u64,
    pub max_token_price: u64,
    pub increase_token_price: u64,
    pub purchased_token_amount: u64,
    pub phase_start_time: i64,
    pub phase_delay_time: i64
}

impl TokenSaleProgramData {
    pub fn init(
        &mut self,
        is_initialized: bool,
        seller_pubkey: Pubkey,
        temp_token_account_pubkey: Pubkey,
        per_token_price: u64,
        max_token_price: u64,
        increase_token_price: u64,
        purchased_token_amount: u64,
        phase_start_time: i64,
        phase_delay_time: i64
    ) {
        self.is_initialized = is_initialized;
        self.seller_pubkey = seller_pubkey;
        self.temp_token_account_pubkey = temp_token_account_pubkey;
        self.per_token_price = per_token_price;
        self.max_token_price = max_token_price;
        self.increase_token_price = increase_token_price;
        self.purchased_token_amount = purchased_token_amount;
        self.phase_start_time = phase_start_time;
        self.phase_delay_time = phase_delay_time;
    }

    pub fn increase_token_amount (
        &mut self,
        purchased_token_amount: u64,
    ) {
        self.purchased_token_amount = self.purchased_token_amount + purchased_token_amount;
    }

    pub fn update_sale_phase (
        &mut self,
        per_token_price: u64,
        phase_start_time: i64,
    ) {
        self.per_token_price = per_token_price;
        self.phase_start_time = phase_start_time;
    }
}

impl Sealed for TokenSaleProgramData {}

impl IsInitialized for TokenSaleProgramData {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl Pack for TokenSaleProgramData {
    const LEN: usize = 113;
    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let src = array_ref![src, 0, TokenSaleProgramData::LEN];
        let (
            is_initialized,
            seller_pubkey,
            temp_token_account_pubkey,
            per_token_price,
            max_token_price,
            increase_token_price,
            purchased_token_amount,
            phase_start_time,
            phase_delay_time
        ) = array_refs![src, 1, 32, 32, 8, 8, 8, 8, 8, 8];

        let is_initialized = match is_initialized {
            [0] => false,
            [1] => true,
            _ => return Err(ProgramError::InvalidAccountData),
        };

        return Ok(TokenSaleProgramData {
            is_initialized,
            seller_pubkey: Pubkey::new_from_array(*seller_pubkey),
            temp_token_account_pubkey: Pubkey::new_from_array(*temp_token_account_pubkey),
            per_token_price: u64::from_le_bytes(*per_token_price),
            max_token_price: u64::from_le_bytes(*max_token_price),
            increase_token_price: u64::from_le_bytes(*increase_token_price),
            purchased_token_amount: u64::from_le_bytes(*purchased_token_amount),
            phase_start_time: i64::from_le_bytes(*phase_start_time),
            phase_delay_time: i64::from_le_bytes(*phase_delay_time),
        });
    }

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let dst = array_mut_ref![dst, 0, TokenSaleProgramData::LEN];
        let (
            is_initialized_dst,
            seller_pubkey_dst,
            temp_token_account_pubkey_dst,
            per_token_price_dst,
            max_token_price_dst,
            increase_token_price_dst,
            purchased_token_amount_dst,
            phase_start_time_dst,
            phase_delay_time_dst
        ) = mut_array_refs![dst, 1, 32, 32, 8, 8, 8, 8, 8, 8];

        let TokenSaleProgramData {
            is_initialized,
            seller_pubkey,
            temp_token_account_pubkey,
            per_token_price,
            max_token_price,
            increase_token_price,
            purchased_token_amount,
            phase_start_time,
            phase_delay_time
        } = self;

        is_initialized_dst[0] = *is_initialized as u8;
        seller_pubkey_dst.copy_from_slice(seller_pubkey.as_ref());
        temp_token_account_pubkey_dst.copy_from_slice(temp_token_account_pubkey.as_ref());
        *per_token_price_dst = per_token_price.to_le_bytes();
        *max_token_price_dst = max_token_price.to_le_bytes();
        *increase_token_price_dst = increase_token_price.to_le_bytes();
        *purchased_token_amount_dst = purchased_token_amount.to_le_bytes();
        *phase_start_time_dst = phase_start_time.to_le_bytes();
        *phase_delay_time_dst = phase_delay_time.to_le_bytes();
    }
}
