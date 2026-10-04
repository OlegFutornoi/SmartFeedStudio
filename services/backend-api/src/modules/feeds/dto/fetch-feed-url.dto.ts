import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class FetchFeedUrlDto {
  @ApiProperty({
    example: 'https://example.com/feeds/products.xml',
    description: 'Public HTTP/HTTPS URL of the XML/CSV feed',
  })
  @IsNotEmpty({ message: 'URL cannot be empty' })
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    { message: 'URL must be a valid HTTP or HTTPS address' },
  )
  url: string;
}
