/**
 * OAuth
 * Response data when oauth request.
 **/
namespace OAuth {
	export type Application = {
		id: string;
		name: string;
		website: string | null;
		redirect_uri: string;
		vapid_key: string | undefined;
		client_id: string;
		client_secret: string;
	};

	export type TokenDataFromServer = {
		access_token: string;
		token_type: string;
		scope: string;
		created_at: number;
		expires_in: number | null;
		refresh_token: string | null;
	};

	export class TokenData {
		public _scope: string;

		constructor(
			public access_token: string,
			public token_type: string,
			scope: string,
			public created_at: number,
			public expires_in: number | null = null,
			public refresh_token: string | null = null,
		) {
			this._scope = scope;
		}

		/**
		 * Serialize raw token data from server
		 * @param raw from server
		 */
		static from(raw: TokenDataFromServer) {
			return new this(
				raw.access_token,
				raw.token_type,
				raw.scope,
				raw.created_at,
				raw.expires_in,
				raw.refresh_token,
			);
		}

		/**
		 * OAuth Aceess Token
		 */
		get accessToken() {
			return this.access_token;
		}

		get tokenType() {
			return this.token_type;
		}

		get scope() {
			return this._scope;
		}

		/**
		 * Application ID
		 */
		get createdAt() {
			return this.created_at;
		}

		get expiresIn() {
			return this.expires_in;
		}

		/**
		 * OAuth Refresh Token
		 */
		get refreshToken() {
			return this.refresh_token;
		}
	}
}

export default OAuth;
